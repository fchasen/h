# -*- coding: utf-8 -*-

import itertools

from sqlalchemy.orm import subqueryload

from h.celery import celery

from h.api import models
from h.api import storage
from h.api.presenters import AnnotationJSONPresenter
from h.api.search.index import index
from h.api.search.index import delete

__all__ = (
    'add_annotation',
    'delete_annotation',
    'check_index',
)


@celery.task
def add_annotation(id_):
    annotation = storage.fetch_annotation(celery.request, id_)
    index(celery.request.es, annotation, celery.request)


@celery.task
def delete_annotation(id_):
    delete(celery.request.es, id_)


@celery.task
def check_index(full=False):
    if not celery.request.feature('postgres'):
        return

    checker = BatchIndexChecker(celery.request.db,
                                celery.request.es,
                                celery.request,
                                full=True)
    checker.check_added_to_index()
    checker.check_deleted_from_index()


class BatchIndexChecker(object):
    def __init__(self, session, es_client, request,
                 full=False,
                 batchsize=2000):
        self.session = session
        self.es_client = es_client
        self.request = request
        self.full = full
        self.batchsize = batchsize

    def check_added_to_index(self):
        def process(pg_batch):
            es_batch = self._fetch_es_batch([ann.id for ann in pg_batch])

            srcbatch = self._transform_pg_batch(pg_batch)
            destbatch = self._transform_es_batch(es_batch)
            self._compare_batch(srcbatch, destbatch)

        self._process_pg_batches(process)

    def check_deleted_from_index(self):
        pass

    def _compare_batch(self, srcbatch, destbatch):
        for id_, src in srcbatch.iteritems():
            dest = destbatch.get(id_, None)
            if dest is None:
                print('Annotation {} is missing from destination'.format(id_))

            if src != dest:
                print('Annotation {} needs updating in destination'.format(id_))
                print(src)
                print(dest)
                raise ValueError('bla')

    def _transform_pg_batch(self, batch):
        transformed = {}

        for ann in batch:
            presented = AnnotationJSONPresenter(self.request, ann).asdict()
            transformed[ann.id] = presented

        return transformed

    def _transform_es_batch(self, batch):
        transformed = {}

        for es_ann in batch:
            id_ = es_ann['_id']
            ann = {'id': id_}
            ann.update(es_ann['_source'])
            transformed[id_] = ann

        return transformed

    def _process_pg_batches(self, func):
        updated = self.session.query(models.Annotation.updated). \
                execution_options(stream_results=True). \
                order_by(models.Annotation.updated.asc()).all()

        size = self.batchsize
        windows = [updated[x:x+size] for x in range(0, len(updated), size)]

        basequery = self.session.query(models.Annotation).options(
            subqueryload(models.Annotation.document).subqueryload(models.Document.document_uris),
            subqueryload(models.Annotation.document).subqueryload(models.Document.meta)
        ).order_by(models.Annotation.updated.asc())

        for window in windows:
            first = window[0].updated
            last = window[-1].updated

            batch = basequery.filter(
                models.Annotation.updated.between(first, last)).all()
            func(batch)

    def _fetch_es_batch(self, ids):
        es = self.es_client
        query = {'query': {'ids': {'values': ids}}}
        result = es.conn.search(index=es.index, doc_type=es.t.annotation,
                                   body=query, size=self.batchsize)
        batch = result['hits']['hits']
        return batch

    def _batch_iter(self, n, iterable):
        it = iter(iterable)
        while True:
            batch = list(itertools.islice(it, n))
            if not batch:
                return
            yield batch


def subscribe_annotation_event(event):
    if not event.request.feature('postgres'):
        return

    if event.action == 'create':
        add_annotation.delay(event.annotation.id)
    elif event.action == 'delete':
        delete_annotation.delay(event.annotation.id)


def includeme(config):
    config.add_subscriber('h.indexer.subscribe_annotation_event',
                          'h.api.events.AnnotationEvent')

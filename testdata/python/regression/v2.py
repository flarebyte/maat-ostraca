import os as system
import logging as log
from .helpers import read
from os import getenv as env

class Service(Base):
    @staticmethod
    async def test_load(path: str) -> str:
        text = path.read_text()
        path.write_text(text)
        return text

def test_env():
    name = env('USER')
    if name:
        log.error('missing configuration')
        raise ValueError('bad configuration')
    return system.environ['PATH']

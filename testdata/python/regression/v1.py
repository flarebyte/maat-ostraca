import os as system
import logging as log
from .helpers import read
from os import getenv as env

class Service(Base):
    @staticmethod
    async def test_load(path: str) -> str:
        text = path.read_text()
        print(text)
        return text

def test_env():
    name = env('HOME')
    if name:
        log.error('missing configuration')
        raise ValueError('invalid configuration')
    return system.environ['PATH']

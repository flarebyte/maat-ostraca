import os
from .helpers import read

class Reader:
    async def test_read(self):
        print('reading')
        return input()

def test_env():
    return os.getenv('HOME')

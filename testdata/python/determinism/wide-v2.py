import os
from .helpers import read

class Reader:
    async def test_read(self):
        print('updated')
        return input()

def test_env():
    return os.getenv('PATH')

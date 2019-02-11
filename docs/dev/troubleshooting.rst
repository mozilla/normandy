Troubleshooting
===============

.. _pip-install-error:

Errors during ``pip install``
-----------------------------
If you get an error like ``pip: error: no such option: --hash``, you are using
too old a version of Pip. Please upgrade to Pip 8 or above.

If you get an error like this, the solution is harder::

  THESE PACKAGES DO NOT MATCH THE HASHES FROM THE REQUIREMENTS FILE. If you have
  updated the package versions, please update the hashes. Otherwise, examine the
  package contents carefully; someone may have tampered with them.
     alabaster==0.7.7 from https://pypi.python.org/packages/py2.py3/a/alabaster/alabaster-0.7.7-py2.py3-none-any.whl
         Expected sha256 d57602b3d730c2ecb978a213face0b7a16ceaa4a263575361bd4fd9e2669a544
               Got        xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

Normandy pins requirements with both a package version, and also a package hash.
This gives reproducibility in builds. If you are sure that there is a good
reason for your packages to have a different hash, add another hash line to
``requirements/default.txt`` for the requirement in question, like this::

  alabaster==0.7.7 \
     --hash d57602b3d730c2ecb978a213face0b7a16ceaa4a263575361bd4fd9e2669a544 \
     --hash xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

This means one of three things:

1. You are using the wrong version of Python. Make sure you are using Python 3.7.
2. You are running on an unexpected platform. You may need to add hashes for
   your platform using hashin.
3. The packages you are downloading are different than expected, either
   because they changed on the server, there has been a network error, or you
   are not downloading them from a trust worthy source. You should consult
   with other developers on the project.

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

A good reason for the hash to be different is if you use a platform that isn't
covered by the existing hashes for a package that has wheels.

def test(selenium):
    selenium.get('http://normandy:8000/control/')
    assert 'SHIELD' in selenium.title

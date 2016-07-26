from marionette_driver import By, expected, Wait


def test_index(marionette):
    marionette.navigate('http://localhost:8000/control/login')
    Wait(marionette).until(expected.element_displayed(By.ID, 'id_username'))

    marionette.find_element(By.ID, 'id_username').send_keys('admin')
    marionette.find_element(By.ID, 'id_password').send_keys('asdf1234')
    marionette.find_element(By.CSS_SELECTOR, '#login-form input[type="submit"]').click()
    Wait(marionette).until(lambda m: m.get_url().endswith('/control/recipe/'))

    assert 'admin' in marionette.find_element(By.CSS_SELECTOR, '#header span').text

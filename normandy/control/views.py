import re

from django.shortcuts import render


delivery_console_urls = {
    "prod": "https://delivery-console.prod.mozaws.net",
    "stage": "https://delivery-console.stage.mozaws.net",
    "dev": "https://delivery-console.dev.mozaws.net",
}


def index(request):
    hostname = request.get_host()

    delivery_console_url = delivery_console_urls["prod"]
    match = re.search("normandy\.(\w+)\.mozaws", hostname, re.I)
    if match:
        env = match.group(1)
        if env in delivery_console_urls:
            delivery_console_url = delivery_console_urls[env]

    # Add any path at the end of the delivery console URL, to hopefully
    # redirect the user to the right page.
    delivery_console_url += request.get_full_path()

    return render(request, "control/index.html", {"DELIVERY_CONSOLE_URL": delivery_console_url})

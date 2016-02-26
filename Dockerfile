FROM python:3.5.1
WORKDIR /app
RUN groupadd --gid 1001 app && useradd -g app --uid 1001 --shell /usr/sbin/nologin app
COPY ./requirements.txt /app/requirements.txt
RUN pip install -U 'pip>=8' && pip install --upgrade --no-cache-dir -r requirements.txt
COPY . /app
RUN ./manage.py collectstatic
RUN mkdir -p media && chown app:app media
RUN mkdir -p __version__
RUN git rev-parse HEAD > __version__/commit
USER app
ENV DJANGO_SETTINGS_MODULE=normandy.settings
ENV DJANGO_CONFIGURATION=Development
ENV PORT=8000
EXPOSE $PORT
CMD gunicorn normandy.wsgi:application --log-file -

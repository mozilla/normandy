const prefix = 'shield-recipe-client';

const prefs = [
  {
    "name": "api_url",
    "type": "string",
    "value": "https://self-repair.mozilla.org/api/v1"
  },
  {
    "name": "enabled",
    "type": "bool",
    "value": true
  },
  {
    "name": "log_level",
    "type": "string",
    "value": "warning"
  },
  {
    "name": "dev_mode",
    "type": "bool",
    "value": false
  },
  {
    "name": "startup_delay",
    "type": "integer",
    "value": 300
  },
  {
    "name": "input_host",
    "title": "Input Host",
    "type": "string"
  }
];

var Preferences = {
  install() {
  },

  uninstall() {
  },
};

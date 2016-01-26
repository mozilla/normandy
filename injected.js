this.onmessage = function(event) {
  postMessage({msg: 'i got an onmessage', obj: event});
  return event * 2;
}

postMessage({source: 'from injected'});

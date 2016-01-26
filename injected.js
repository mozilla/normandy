this.onmessage = function(event) {
  postMessage({msg: 'i got an onmessage', obj: event});
  return event;
}

postMessage({source: 'from injected'});

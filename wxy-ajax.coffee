handlers =
  xml: (xhr) -> xhr.responseXML
  text: (xhr) -> xhr.responseText
  document: (xhr) -> xhr.response
  arraybuffer: (xhr) -> xhr.response
  blob: (xhr) -> xhr.response
  json: (xhr) ->
    response = xhr.responseText
    try
      return JSON.parse response
    catch exception
      console.warn 'core-ajax caught an exception trying to parse response as JSON:'
      console.warn exception
      return response

Polymer
  is: 'wxy-ajax'

  properties:
    url: String
    handleAs: String
    params: Object
    method: String
    headers: String
    body: String
    contentType: String
    withCredentials: Boolean

  ready: ->
    @xhr = new CoreXhr()
    return

  send: (args) ->
    args.headers = args.headers or {}
    hasContentType = Object.keys(args.headers).some (header) ->
      header.toLowerCase() is 'content-type'

    # No Content-Type should be specified if sending `FormData`.
    # The UA must set the Content-Type w/ a calculated  multipart boundary ID.
    if args.body instanceof FormData
      delete args.headers['Content-Type']

    else if not hasContentType and args.contentType
      args.headers['Content-Type'] = args.contentType

    if args.handleAs in ['arraybuffer', 'blob', 'document']
      args.responseType = args.handleAs

    new Promise (resolve, reject) =>
      args.callback = (response, xhr) =>
        if @_IsSuccess xhr
          result = @_EvalResponse xhr, args.handleAs
          resolve result
        else
          reject
            statusCode: xhr.status
            response: @_EvalResponse xhr, args.handleAs

      @xhr.request args


  _EvalResponse: (xhr, handleAs) -> handlers[handleAs or 'json'] xhr

  _IsSuccess: (xhr) ->
    status = xhr.status or 0
    200 <= status < 300

  _GetParams:(params) ->
    if params and typeof(params) is 'string'
      params = JSON.parse params

    params

CoreXhr = Polymer
  is: 'core-xhr'

  bodyMethods:
    POST: 1
    PUT: 1
    PATCH: 1
    DELETE: 1

  request: (options) ->
    xhr = new XMLHttpRequest
    url = options.url
    method = options.method or 'GET'
    async = !options.sync

    params = @toQueryString(options.params)
    if params and method.toUpperCase() == 'GET'
      url += (if url.indexOf('?') > 0 then '&' else '?') + params

    xhrParams = if @isBodyMethod(method) then options.body or params else null

    xhr.open method, url, async
    if options.responseType
      xhr.responseType = options.responseType

    if options.withCredentials
      xhr.withCredentials = true

    @makeReadyStateHandler xhr, options.callback
    @setRequestHeaders xhr, options.headers

    xhr.send xhrParams
    if !async
      xhr.onreadystatechange xhr
    xhr

  toQueryString: (params) ->
    r = []
    for n of params
      v = params[n]
      n = encodeURIComponent(n)
      r.push if v == null then n else n + '=' + encodeURIComponent(v)
    r.join '&'

  isBodyMethod: (method) ->
    @bodyMethods[(method or '').toUpperCase()]

  makeReadyStateHandler: (xhr, callback) ->

    xhr.onreadystatechange = ->
      if xhr.readyState == 4
        callback and callback.call(null, xhr.response, xhr)
      return

    return

  setRequestHeaders: (xhr, headers) ->
    if headers
      for name of headers
        xhr.setRequestHeader name, headers[name]
    return

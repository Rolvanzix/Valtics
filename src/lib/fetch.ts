// Safe browser-native WHATWG fetch ponyfill replacing buggy cross-fetch in browser bundles
const _fetch = typeof window !== 'undefined' ? window.fetch.bind(window) : globalThis.fetch;
const _Headers = typeof window !== 'undefined' ? window.Headers : globalThis.Headers;
const _Request = typeof window !== 'undefined' ? window.Request : globalThis.Request;
const _Response = typeof window !== 'undefined' ? window.Response : globalThis.Response;

type FetchFunction = typeof globalThis.fetch;

interface FetchWithStatics extends FetchFunction {
  default: FetchWithStatics;
  fetch: FetchWithStatics;
  Headers: typeof Headers;
  Request: typeof Request;
  Response: typeof Response;
}

const fetchWrapper = ((input: RequestInfo | URL, init?: RequestInit) => {
  return _fetch(input, init);
}) as FetchWithStatics;

fetchWrapper.default = fetchWrapper;
fetchWrapper.fetch = fetchWrapper;
fetchWrapper.Headers = _Headers;
fetchWrapper.Request = _Request;
fetchWrapper.Response = _Response;

export default fetchWrapper;
export {
  fetchWrapper as fetch,
  _Headers as Headers,
  _Request as Request,
  _Response as Response,
};

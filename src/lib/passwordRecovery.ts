// Runtime recovery codes only. Fragment stays in the current tab, never in HTTP/referrers.
export function recoveryLocation(href:string) {
  const url=new URL(href)
  const queryToken=url.searchParams.get('token')
  const fragment=new URLSearchParams(url.hash.slice(1))
  const candidate=queryToken??fragment.get('token')??''
  const invalid=url.searchParams.has('error')||fragment.has('error')
  const token=!invalid&&candidate.length<=512?candidate:''
  url.search=''
  url.hash=token?new URLSearchParams({token}).toString():invalid?'error=INVALID_TOKEN':''
  return {token,invalid,cleanUrl:url.pathname+url.hash}
}

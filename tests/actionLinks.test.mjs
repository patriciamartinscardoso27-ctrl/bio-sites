import { test } from 'node:test'
import assert from 'node:assert/strict'
import { actionDestination, actionKind, actionTypes, businessValue, createAction, moveAction, safeWebUrl } from '../src/lib/actionLinks.ts'

const bio = { phone: '55 (11) 99999-0000', telephone: '+55 11 3333-0000', email: 'loja@example.com',
  instagram: 'https://instagram.com/loja', facebook: 'https://facebook.com/loja', tiktok: 'https://tiktok.com/@loja',
  address: 'Rua das Flores, 128 · São Paulo', mapsUrl: '', reviewsUrl: 'https://g.page/r/example/review',
  website: 'https://example.com', menuUrl: 'https://example.com/cardapio.pdf' }
const action = (kind, extra = {}) => ({ id: kind, kind, label: 'Texto editável', message: '', source: 'custom', ...extra })

test('the picker includes exactly the 14 requested types', () => {
  assert.equal(actionTypes.length, 14)
  assert.equal(new Set(actionTypes.map(t => t.kind)).size, 14)
})
test('legacy buttons retain business WhatsApp, Instagram and Maps destinations', () => {
  assert.equal(actionKind({ id: 'old', label: 'Agendar', message: '' }), 'whatsapp')
  assert.equal(actionDestination({ id: 'old', label: 'Agendar', message: 'Olá & bom dia!' }, bio).href, 'https://wa.me/5511999990000?text=Ol%C3%A1%20%26%20bom%20dia!')
  assert.equal(actionDestination({ id: 'ig', kind: 'instagram', label: 'Instagram', message: '' }, bio).href, bio.instagram)
  assert.equal(actionDestination({ id: 'map', kind: 'location', label: 'Como chegar', message: '' }, bio).href, `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(bio.address)}`)
})
test('WhatsApp sanitizes formatted numbers and encodes optional messages', () => {
  assert.equal(actionDestination(action('whatsapp', { number: '+55 (21) 98888-7777', message: 'Olá! Orçamento R$ 10 & 20?' }), bio).href,
    `https://wa.me/5521988887777?text=${encodeURIComponent('Olá! Orçamento R$ 10 & 20?')}`)
  assert.equal(actionDestination(action('whatsapp', { number: '5521988887777' }), bio).href, 'https://wa.me/5521988887777')
  assert.ok(actionDestination(action('whatsapp', { number: 'abc5511999990000' }), bio).error)
  assert.ok(actionDestination(action('whatsapp', { number: '123' }), bio).error)
})
test('all seven URL-only types accept independent valid destinations', () => {
  for (const kind of ['instagram', 'facebook', 'tiktok', 'reviews', 'website', 'menu', 'custom']) {
    assert.equal(actionDestination(action(kind, { url: 'https://example.com/path?q=1&v=2' }), bio).href, 'https://example.com/path?q=1&v=2')
    assert.ok(actionDestination(action(kind, { url: 'javascript:alert(1)' }), bio).error)
  }
})
test('Maps can use a dedicated link, inherited Maps URL, or inherited address', () => {
  const maps = 'https://maps.app.goo.gl/example'
  assert.equal(actionDestination(action('location', { url: maps }), bio).href, maps)
  assert.equal(actionDestination(action('location', { source: 'business' }), { ...bio, mapsUrl: maps }).href, maps)
  assert.ok(actionDestination(action('location', { source: 'business' }), { ...bio, address: '' }).error)
})
test('phone and email generate their own protocols and reject injected content', () => {
  assert.equal(actionDestination(action('phone', { number: '+55 (11) 3333-1234' }), bio).href, 'tel:+551133331234')
  assert.equal(actionDestination(action('email', { email: ' contato@example.com ' }), bio).href, 'mailto:contato@example.com')
  assert.ok(actionDestination(action('email', { email: 'a@example.com?bcc=other@example.com' }), bio).error)
  assert.ok(actionDestination(action('email', { email: 'invalid' }), bio).error)
  assert.ok(actionDestination(action('phone', { number: 'call me' }), bio).error)
})
test('booking, quote and order support both WhatsApp and independent external URLs', () => {
  for (const kind of ['booking', 'quote', 'order']) {
    const item = createAction(kind, bio, kind)
    assert.equal(item.mode, 'whatsapp')
    assert.equal(item.source, 'business')
    assert.match(actionDestination(item, bio).href, /^https:\/\/wa\.me\/5511999990000\?text=/)
    assert.equal(actionDestination({ ...item, mode: 'url', source: 'custom', url: 'https://example.com/book' }, bio).href, 'https://example.com/book')
  }
})
test('contact reuse follows changes to business data and never overwrites a custom destination', () => {
  const reusable = createAction('instagram', bio, 'ig')
  assert.equal(reusable.source, 'business')
  assert.equal(businessValue(reusable, bio), bio.instagram)
  assert.equal(actionDestination(reusable, { ...bio, instagram: 'https://instagram.com/new' }).href, 'https://instagram.com/new')
  assert.equal(actionDestination({ ...reusable, source: 'custom', url: 'https://instagram.com/custom' }, bio).href, 'https://instagram.com/custom')
  assert.equal(createAction('email', { ...bio, email: '' }, 'mail').source, 'custom')
})
test('editing labels and activation cannot change destination kind or link', () => {
  const original = action('reviews', { url: bio.reviewsUrl })
  const edited = { ...original, label: 'Deixe sua avaliação', enabled: false }
  assert.equal(actionKind(edited), 'reviews')
  assert.deepEqual(actionDestination(edited, bio), actionDestination(original, bio))
})
test('ordering has stable boundaries and does not mutate existing arrays or buttons', () => {
  const actions = ['a', 'b', 'c'].map(id => ({ id, label: id, message: '' }))
  assert.deepEqual(moveAction(actions, 1, -1).map(a => a.id), ['b', 'a', 'c'])
  assert.deepEqual(moveAction(actions, 1, 1).map(a => a.id), ['a', 'c', 'b'])
  assert.deepEqual(moveAction(actions, 0, -1), actions)
  assert.deepEqual(moveAction(actions, 2, 1), actions)
  assert.deepEqual(actions.map(a => a.id), ['a', 'b', 'c'])
})
test('URL validation allows bare domains but blocks unsafe protocols, credentials and spaces', () => {
  assert.equal(safeWebUrl('example.com/menu'), 'https://example.com/menu')
  for (const value of ['', 'javascript:alert(1)', 'data:text/html,test', 'file:///C:/test', 'https://user:pass@example.com', 'https://example.com/a b', 'not-a-url']) assert.equal(safeWebUrl(value), undefined)
})

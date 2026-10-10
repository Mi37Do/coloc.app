import { deepLinkToPath } from './native'

describe('deepLinkToPath', () => {
  it('maps the custom scheme and web links to the join page', () => {
    expect(deepLinkToPath('coloc://join/AbC123_-xyz')).toBe('/join/AbC123_-xyz')
    expect(deepLinkToPath('https://coloc.example.com/join/AbC123_-xyz')).toBe('/join/AbC123_-xyz')
    expect(deepLinkToPath('https://localhost:5174/join/AbC123_-xyz/')).toBe('/join/AbC123_-xyz')
  })

  it('ignores anything else', () => {
    expect(deepLinkToPath('coloc://settings')).toBeNull()
    expect(deepLinkToPath('https://evil.example/join/../admin')).toBeNull()
    expect(deepLinkToPath('https://x.test/join/short')).toBeNull()
    expect(deepLinkToPath('not a url')).toBeNull()
  })
})

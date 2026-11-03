import test from 'node:test';
import assert from 'node:assert/strict';
import { homeStructuredData } from '../src/config/search.js';
import { FAQS } from '../src/pages/home-v2/content.js';

test('generated search offer matches the current $199 and 14-day public offer', () => {
  const offer = homeStructuredData(FAQS)['@graph'].find(item => item['@type'] === 'SoftwareApplication').offers;
  assert.equal(offer.price, '199');
  assert.equal(offer.priceSpecification.price, '199');
  assert.equal(offer.priceCurrency, 'USD');
  assert.match(offer.description, /14-day pilot/);
  assert.match(offer.description, /\$199\/month/);
});

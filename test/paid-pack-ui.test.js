import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {transform} from 'esbuild';
import React, {act, useRef, useState} from 'react';
import {createRoot} from 'react-dom/client';
import {JSDOM} from 'jsdom';
import {webcrypto} from 'node:crypto';

const source=(await readFile(new URL('../src/components/CurrentPeriodPacks.jsx',import.meta.url),'utf8'))
  .replace(/^import .*;$/gm,'').replace('export default function','function');
const js=(await transform(source,{loader:'jsx',format:'cjs'})).code;

test('pack UI blocks double click and reuses request after uncertain response and reload',async()=>{
  const dom=new JSDOM('<div id="app"></div>',{url:'https://www.roofaileadrecovery.com/account'});
  const previousWindow=globalThis.window,previousDocument=globalThis.document,previousAct=globalThis.IS_REACT_ACT_ENVIRONMENT;
  globalThis.window=dom.window;globalThis.document=dom.window.document;globalThis.IS_REACT_ACT_ENVIRONMENT=true;
  let root,resolve;const calls=[],redirects=[];
  const supabase={functions:{invoke:async(name,options)=>{calls.push({name,...options});return new Promise(r=>resolve=r);}}};
  const Component=new Function('React','useRef','useState','supabase','window','sessionStorage','crypto',js+'\nreturn CurrentPeriodPacks;')(
    React,useRef,useState,supabase,{location:{assign:url=>redirects.push(url)}},dom.window.sessionStorage,webcrypto);
  try{
    root=createRoot(dom.window.document.getElementById('app'));
    await act(async()=>root.render(React.createElement(Component)));
    const first=dom.window.document.querySelector('button');
    await act(async()=>{first.click();first.click();});
    assert.equal(calls.length,1);assert.equal(calls[0].body.calls,20);assert.match(calls[0].body.request_id,/^[0-9a-f-]{36}$/);assert.ok(first.disabled);
    await act(async()=>resolve({error:Error('timeout')}));
    assert.match(dom.window.document.querySelector('[role=alert]').textContent,/could not be confirmed/);
    await act(async()=>first.click());assert.deepEqual(calls[1].body,calls[0].body);
    await act(async()=>resolve({error:Error('timeout')}));
    await act(async()=>root.unmount());
    root=createRoot(dom.window.document.getElementById('app'));
    await act(async()=>root.render(React.createElement(Component)));
    await act(async()=>dom.window.document.querySelector('button').click());
    assert.deepEqual(calls[2].body,calls[0].body);
    await act(async()=>resolve({data:{url:'https://checkout.stripe.com/c/pay/cs_fixture'}}));
    assert.deepEqual(redirects,['https://checkout.stripe.com/c/pay/cs_fixture']);
  }finally{
    if(root)await act(async()=>root.unmount());dom.window.close();globalThis.window=previousWindow;globalThis.document=previousDocument;globalThis.IS_REACT_ACT_ENVIRONMENT=previousAct;
  }
});

import test from 'tape'
import { createModule } from '../src'

test('[Extras] it should create selectors', assert => {

  const { selectModule, selectFoo, selectBar, selectTripleFooPlusDoubleBar } = createModule('myModule', {}, {}, {
    selectorFactory: ({ selectModule, createSelector }) => {
      const selectFoo = createSelector(selectModule, state => state.foo)
      const selectBar = createSelector([ selectModule ], state => state.bar)
      const selectTripleFooPlusDoubleBar = createSelector([ selectFoo, selectBar ], (foo, bar) => foo * 3 + bar * 2)
      return { selectFoo, selectBar, selectTripleFooPlusDoubleBar }
    }
  })

  const globalState = {
    myModule: {
      foo: 3,
      bar: 4,
    },
  }

  assert.deepEqual(selectModule(globalState), { foo: 3, bar: 4 })
  assert.deepEqual(selectFoo(globalState), 3)
  assert.deepEqual(selectBar(globalState), 4)
  assert.deepEqual(selectTripleFooPlusDoubleBar(globalState), 3 * 3 + 4 * 2)

  assert.ok(selectModule.effect(globalState).SELECT)
  assert.ok(selectFoo.effect(globalState).SELECT)
  assert.ok(selectBar.effect(globalState).SELECT)
  assert.ok(selectTripleFooPlusDoubleBar.effect(globalState).SELECT)

  assert.end()
})

import React from 'react'
import { render } from 'react-dom'
import { Provider, connect } from 'react-redux'
import configureStore from './store'
import * as reducers from './moducks'
import * as sagas from './moducks/sagas'
import { inputChange, load } from './moducks/npmSearch'

import InfiniteScroll from 'react-infinite-scroll-component'
import { CubeGrid } from 'better-react-spinkit'
import JSONTree from 'react-json-tree'
import classNames from 'classnames/bind'
import styles from './main.css'

const store = configureStore(reducers, sagas)
store.runSaga()

const cx = classNames.bind(styles)

const App = connect(
  ({ npmSearch }) => ({ npmSearch }),
  { inputChange, load },
)(({ npmSearch, inputChange, load }) => {

  return (
    <div className={cx('flex', 'divider')}>
      <div className={cx('column', 'columnLeft')}>
        <div className={cx('flex')}>
          <img className={cx('npm')} src="https://cdn.rawgit.com/npm/logos/master/%22npm%22%20lockup/npm.png" />
          <input className={cx('input')} type="text" placeholder="Search..." onChange={e => inputChange(e.target.value)} />
        </div>
        <div className={cx('scroll')}>
          <div className={cx('scrollSpinner',  { active: npmSearch.pending })}>
            <CubeGrid size={50} color="rgba(38, 139, 210, 0.6)" />
          </div>
          <InfiniteScroll
            next={() => load()}
            hasMore={npmSearch.hasMore}
            endMessage={npmSearch.q && <div className={cx('scrollEnd')}>All packages are loaded!</div>}
            height={300}
          >
            {npmSearch.packages.map(pkg =>
              <div key={pkg.name} className={cx('scrollItem')}>
                <a className={cx('scrollItemName')} href={`https://www.npmjs.com/package/${pkg.name}`} target="_blank">{pkg.name}</a>
                <p className={cx('scrollItemDescription')}>{pkg.description}</p>
              </div>
            )}
          </InfiniteScroll>
        </div>
      </div>
      <div className={cx('column', 'columnRight')}>
        <JSONTree data={npmSearch} />
      </div>
    </div>
  )
})

render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById('root'),
)

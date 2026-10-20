import React from 'react';
import ReactDOM from 'react-dom/client';
import { createHashRouter, RouterProvider } from 'react-router-dom';
import { App } from './App';
import { initialize } from './db/database';
import './styles.css';

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<div className="boot"><div className="brand-mark">R</div><h1>RepLog</h1><p>正在载入…</p></div>);
initialize().then(() => root.render(<React.StrictMode><RouterProvider router={createHashRouter([{ path: '*', element: <App /> }])} /></React.StrictMode>)).catch(error => {
  root.render(<div className="boot"><h1>本地存储暂不可用</h1><p>请确认允许此站点保存数据，再刷新重试。已有数据不会被清空。</p><p className="muted">{String(error.message)}</p><button onClick={() => location.reload()}>重新尝试</button></div>);
});

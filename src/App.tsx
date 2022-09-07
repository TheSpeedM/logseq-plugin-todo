import 'virtual:windi.css';
import React, { useEffect, useRef } from 'react';
import { ErrorBoundary, FallbackProps } from 'react-error-boundary';
import dayjs from 'dayjs';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import TaskInput, { ITaskInputRef } from './components/TaskInput';
import TaskSection from './components/TaskSection';
import { logseq as plugin } from '../package.json';
import { useRecoilCallback, useRecoilRefresher_UNSTABLE, useRecoilSnapshot, useRecoilValue } from 'recoil';
import { visibleState } from './state/visible';
import { tasksState } from './state/tasks';
import { userConfigsState } from './state/user-configs';
import { themeStyleState } from './state/theme';
import getTodayTaskQuery from './querys/today';
import './style.css';
import getScheduledTaskQuery from './querys/scheduled';
import getAnytimeTaskQuery from './querys/anytime';

dayjs.extend(advancedFormat);

function ErrorFallback({ error }: FallbackProps) {
  useEffect(() => {
    window.logseq.App.showMsg(`[${plugin.id}]: ${error.message}`, 'error');
  }, [error.message]);

  return (
    <div role="alert" className="text-red-500 font-semibold">
      <p>Todo list failed to render.</p>
      <p>Can you re-index your graph and try again?</p>
    </div>
  );
}

function App() {
  const innerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<ITaskInputRef>(null);
  const visible = useRecoilValue(visibleState);
  const userConfigs = useRecoilValue(userConfigsState);
  const themeStyle = useRecoilValue(themeStyleState);

  const refreshAll = useRecoilCallback(({ snapshot, refresh }) =>
    () => {
      for (const node of snapshot.getNodes_UNSTABLE({ isModified: true })) {
        refresh(node);
      }
    },
    [],
  );

  useEffect(() => {
    if (visible) {
      inputRef.current?.focus();

      const keydownHandler = (ev: KeyboardEvent) => {
        if (ev.key === 'Escape') {
          window.logseq.hideMainUI();
        }
      };
      document.addEventListener('keydown', keydownHandler);
      return () => {
        document.removeEventListener('keydown', keydownHandler);
      };
    }
  }, [visible]);

  const handleClickOutside = (e: React.MouseEvent) => {
    if (!innerRef.current?.contains(e.target as any)) {
      window.logseq.hideMainUI();
    }
  };

  const createNewTask = async (content: string) => {
    const { preferredDateFormat, preferredTodo } = userConfigs!;
    const date = dayjs().format(preferredDateFormat);
    let page = await window.logseq.Editor.getPage(date);
    if (page === null) {
      page = await window.logseq.Editor.createPage(date, {
        journal: true,
        redirect: false,
      });
    }
    await window.logseq.Editor.insertBlock(
      page!.name,
      `${preferredTodo} ${content}`,
      { isPageBlock: true, before: false },
    );
    refreshAll();
  };

  return (
    <main
      className={`w-screen h-screen ${visible ? 'block' : 'hidden'}`}
      onClick={handleClickOutside}
    >
      <div ref={innerRef} id={plugin.id}>
        <div
          className="absolute p-4 w-90 h-120 -left-13rem bg-white shadow rounded-lg overflow-y-auto border-2"
          style={{
            backgroundColor: themeStyle.primaryBackgroundColor,
            borderColor: themeStyle.secondaryBackgroundColor,
          }}
        >
          <ErrorBoundary FallbackComponent={ErrorFallback}>
            <TaskInput ref={inputRef} onCreateTask={createNewTask} />
            <React.Suspense fallback={null}>
              <TaskSection title="Today" query={getTodayTaskQuery()} />
              <TaskSection title="Scheduled" query={getScheduledTaskQuery()} />
              <TaskSection title="Anytime" query={getAnytimeTaskQuery()} />
            </React.Suspense>
          </ErrorBoundary>
        </div>
      </div>
    </main>
  );
}

export default App;

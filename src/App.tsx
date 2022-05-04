import 'virtual:windi.css';
import React, { useEffect, useRef } from 'react';
import { ErrorBoundary, FallbackProps } from 'react-error-boundary';
import dayjs from 'dayjs';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import useAppVisible from './hooks/useAppVisible';
import TaskInput, { ITaskInputRef } from './components/TaskInput';
import TaskSection from './components/TaskSection';
import { logseq as plugin } from '../package.json';
import useAppState, { withAppState } from './hooks/useAppState';
import './style.css';

dayjs.extend(advancedFormat);

function ErrorFallback({ error }: FallbackProps) {
  useEffect(() => {
    window.logseq.App.showMsg(`[${plugin.id}]: ${error.message}`, 'error');
  }, []);

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
  const visible = useAppVisible();
  const { userConfigs, refresh, tasks } = useAppState();

  useEffect(() => {
    if (visible) {
      refresh();
      inputRef.current?.focus();
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
    refresh();
  };

  return (
    <main
      className={`w-screen h-screen ${visible ? 'block' : 'hidden'}`}
      onClick={handleClickOutside}
    >
      <div ref={innerRef} id={plugin.id}>
        <div className="absolute p-4 w-90 h-120 -left-13rem bg-white shadow rounded-lg overflow-y-auto border border-gray-100">
          <ErrorBoundary FallbackComponent={ErrorFallback}>
            <TaskInput ref={inputRef} onCreateTask={createNewTask} />
            <div>
              <TaskSection title="Today" tasks={tasks.today} />
              <TaskSection title="Scheduled" tasks={tasks.scheduled} />
              <TaskSection title="Anytime" tasks={tasks.anytime} />
            </div>
          </ErrorBoundary>
        </div>
      </div>
    </main>
  );
}

export default withAppState(App);

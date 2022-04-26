import 'virtual:windi.css';
import React, { useRef } from 'react';
import useAppVisible from './hooks/useAppVisible';
import useIconPosition from './hooks/useIconPosition';
import dayjs from 'dayjs';
import TaskInput from './components/TaskInput';
import useUserConfigs, { withUserConfigs } from './hooks/useUserConfigs';
import TaskSection from './components/TaskSection';
import getAnytimeTaskQuery from './querys/anytime';
import getScheduledTaskQuery from './querys/scheduled';
import getTodayTaskQuery from './querys/today';

function App() {
  const innerRef = useRef<HTMLDivElement>(null);
  const visible = useAppVisible();
  const position = useIconPosition('logseq-plugin-tasks-icon');
  const userConfigs = useUserConfigs();

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
  };

  return (
    <main
      className={`w-screen h-screen ${visible ? 'block' : 'hidden'}`}
      onClick={handleClickOutside}
    >
      <div
        ref={innerRef}
        id="task-panel"
        className="p-4 w-90 h-120 bg-white shadow rounded-lg overflow-y-auto border border-gray-100"
        style={{
          position: 'fixed',
          top: position.bottom + 30,
          left: position.right - 400,
        }}
      >
        <TaskInput onCreateTask={createNewTask} />
        <div>
          <TaskSection title="Today" query={getTodayTaskQuery()} />
          <TaskSection title="Scheduled" query={getScheduledTaskQuery()} />
          <TaskSection title="Anytime" query={getAnytimeTaskQuery()} />
        </div>
      </div>
    </main>
  );
}

export default withUserConfigs(App);

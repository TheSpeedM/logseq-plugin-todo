import 'virtual:windi.css';
import React, { useRef } from 'react';
import useAppVisible from './hooks/useAppVisible';
import useIconPosition from './hooks/useIconPosition';
import dayjs from 'dayjs';
import TaskInput from './components/TaskInput';
import useUserConfigs from './hooks/useUserConfigs';
import TaskSection from './components/TaskSection';
import Task from './models/Task';

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
    const format = preferredDateFormat
      .replace('yyyy', 'YYYY')
      .replace('dd', 'DD')
      .replace('do', 'Do')
      .replace('EEEE', 'dddd')
      .replace('EEE', 'ddd')
      .replace('EE', 'dd')
      .replace('E', 'dd');
    const date = dayjs().format(format);
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
          <TaskSection title="Today" query={Task.getTodayTaskQuery()} />
          <TaskSection title="Expired" query={Task.getExpiredTaskQuery()} />
          <TaskSection title="Scheduled" query={Task.getScheduledTaskQuery()} />
          <TaskSection title="No Scheduled" query={Task.getNoScheduledTaskQuery()} />
        </div>
      </div>
    </main>
  );
}

export default App;

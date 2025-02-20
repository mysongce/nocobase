export * from './Branch';
export * from './FlowContext';
export * from './nodes';
export { triggers } from './triggers';

import { Plugin, useCollectionDataSource } from '@nocobase/client';
import React from 'react';
import { DynamicExpression } from './components/DynamicExpression';
import { ExecutionPage } from './ExecutionPage';
import { WorkflowTodo } from './nodes/manual/WorkflowTodo';
import { WorkflowTodoBlockInitializer } from './nodes/manual/WorkflowTodoBlockInitializer';
import { WorkflowPage } from './WorkflowPage';
import { WorkflowProvider } from './WorkflowProvider';

export class WorkflowPlugin extends Plugin {
  async load() {
    this.addRoutes();
    this.addComponents();
    this.app.use(WorkflowProvider);
  }

  addScopes() {
    this.app.addScopes({
      useCollectionDataSource,
    });
  }

  addComponents() {
    this.app.addComponents({
      WorkflowPage,
      ExecutionPage,
      WorkflowTodo,
      WorkflowTodoBlockInitializer,
      DynamicExpression,
    });
  }

  addRoutes() {
    this.app.router.add('admin.settings.workflow.workflows.id', {
      path: '/admin/settings/workflow/workflows/:id',
      element: <WorkflowPage />,
    });
    this.app.router.add('admin.settings.workflow.executions.id', {
      path: '/admin/settings/workflow/executions/:id',
      element: <ExecutionPage />,
    });
  }
}

export default WorkflowPlugin;

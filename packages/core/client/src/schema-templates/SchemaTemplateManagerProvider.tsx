import { ISchema, useFieldSchema } from '@formily/react';
import { uid } from '@formily/shared';
import { Spin } from 'antd';
import { cloneDeep } from 'lodash';
import React, { createContext, ReactNode, useContext, useMemo } from 'react';
import { useAPIClient, useRequest } from '../api-client';
import { Plugin } from '../application/Plugin';
import { BlockTemplate } from './BlockTemplate';

export const SchemaTemplateManagerContext = createContext<any>({});

export const SchemaTemplateManagerProvider: React.FC<any> = (props) => {
  const { templates, refresh } = props;
  return (
    <SchemaTemplateManagerContext.Provider value={{ templates, refresh }}>
      {props.children}
    </SchemaTemplateManagerContext.Provider>
  );
};

const regenerateUid = (s: ISchema) => {
  s['name'] = s['x-uid'] = uid();
  Object.keys(s.properties || {}).forEach((key) => {
    regenerateUid(s.properties[key]);
  });
};

export const useSchemaTemplate = () => {
  const { getTemplateBySchema, templates } = useSchemaTemplateManager();
  const fieldSchema = useFieldSchema();
  const schemaId = fieldSchema['x-uid'];
  const templateKey = fieldSchema['x-template-key'];
  // console.log('templateKey', { schemaId, templateKey })
  return useMemo(() => getTemplateBySchema(fieldSchema), [schemaId, templateKey]);
};

export const useSchemaTemplateManager = () => {
  const { refresh, templates = [] } = useContext(SchemaTemplateManagerContext);
  const api = useAPIClient();
  return {
    templates,
    refresh,
    async getTemplateSchemaByMode(options) {
      const { mode, template } = options;
      if (mode === 'copy') {
        const { data } = await api.request({
          url: `/uiSchemas:getJsonSchema/${template.uid}?includeAsyncNode=true`,
        });
        const s = data?.data || {};
        regenerateUid(s);
        return cloneDeep(s);
      } else if (mode === 'reference') {
        return {
          type: 'void',
          'x-component': 'BlockTemplate',
          'x-component-props': {
            templateId: template.key,
          },
        };
      }
    },
    async copyTemplateSchema(template) {
      const { data } = await api.request({
        url: `/uiSchemas:getJsonSchema/${template.uid}?includeAsyncNode=true`,
      });
      const s = data?.data || {};
      regenerateUid(s);
      return cloneDeep(s);
    },
    async saveAsTemplate(values) {
      const { uid: schemaId } = values;
      const key = uid();
      await api.resource('uiSchemas').saveAsTemplate({
        filterByTk: schemaId,
        values: {
          key,
          ...values,
        },
      });
      await refresh();
      return { key };
    },
    getTemplateBySchema(schema) {
      const templateKey = schema['x-template-key'];
      if (templateKey) {
        return templates?.find((template) => template.key === templateKey);
      }
      const schemaId = schema['x-uid'];
      if (schemaId) {
        return templates?.find((template) => template.uid === schemaId);
      }
    },
    getTemplateBySchemaId(schemaId) {
      if (!schemaId) {
        return null;
      }
      return templates?.find((template) => template.uid === schemaId);
    },
    getTemplateById(key) {
      return templates?.find((template) => template.key === key);
    },
    getTemplatesByCollection(collectionName: string, resourceName: string = null) {
      const items = templates?.filter?.((template) => template.collectionName === collectionName);
      return items || [];
    },
    getTemplatesByComponentName(componentName: string): Array<any> {
      const items = templates?.filter?.((template) => template.componentName === componentName);
      return items || [];
    },
  };
};

export const RemoteSchemaTemplateManagerProvider: React.FC<{ children?: ReactNode }> = (props) => {
  const api = useAPIClient();
  const options = {
    resource: 'uiSchemaTemplates',
    action: 'list',
    params: {
      appends: ['collection'],
      paginate: false,
    },
  };
  const service = useRequest(options);
  if (service.loading) {
    return <Spin />;
  }
  return (
    <SchemaTemplateManagerProvider
      refresh={async () => {
        const { data } = await api.request(options);
        service.mutate(data);
      }}
      templates={service?.data?.data}
    >
      {props.children}
    </SchemaTemplateManagerProvider>
  );
};

export class RemoteSchemaTemplateManagerPlugin extends Plugin {
  async load() {
    this.addRoutes();
    this.addComponents();
    this.app.use(RemoteSchemaTemplateManagerProvider);
  }

  addComponents() {
    this.app.addComponents({
      BlockTemplate,
    });
  }

  addRoutes() {
    this.app.router.add('admin.plugins.block-templates', {
      path: '/admin/plugins/block-templates',
      Component: 'BlockTemplatePage',
    });
    this.app.router.add('admin.plugins.block-templates-key', {
      path: '/admin/plugins/block-templates/:key',
      Component: 'BlockTemplateDetails',
    });
  }
}

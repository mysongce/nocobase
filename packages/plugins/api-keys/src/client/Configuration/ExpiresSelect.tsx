import { css } from '@emotion/css';
import { connect, mapProps, mapReadPretty } from '@formily/react';
import { useRecord } from '@nocobase/client';
import { useBoolean } from 'ahooks';
import { DatePicker, Select, Space, Typography } from 'antd';
import moment from 'moment';
import React, { useMemo } from 'react';
import { useTranslation } from '../locale';

const TOMORROW = moment().add(1, 'days');

const spaceCSS = css`
  width: 100%;
  & > .ant-space-item {
    flex: 1;
  }
`;

const InternalExpiresSelect = (props) => {
  const { onChange } = props;
  const [isCustom, { toggle: toggleShowDatePicker, setFalse }] = useBoolean();

  const onSelectChange = (v) => {
    if (v === 'custom') {
      onChange('1d');
      return toggleShowDatePicker();
    } else {
      setFalse();
      onChange(v);
    }
  };

  const onDatePickerChange = (v: moment.Moment) => {
    v = v.milliseconds(0).second(0);
    const NOW = moment().milliseconds(0).seconds(0);
    const value = `${v.diff(NOW, 'd')}d`;
    onChange(value);
  };

  return (
    <Space className={spaceCSS}>
      <Select {...props} value={isCustom ? 'custom' : props.value} onChange={onSelectChange}></Select>
      {isCustom ? (
        <DatePicker
          disabledDate={(time) => {
            return time.isSameOrBefore();
          }}
          defaultValue={TOMORROW}
          onChange={onDatePickerChange}
          showToday={false}
          allowClear={false}
        />
      ) : null}
    </Space>
  );
};

const ReadPretty = () => {
  const { expiresIn, createdAt } = useRecord();
  const { t } = useTranslation();
  const expiresDate = useMemo(() => {
    if (expiresIn === 'never') return t('Never expires');

    return moment(createdAt)
      .add(expiresIn?.replace('d', '') || 0, 'days')
      .format('YYYY-MM-DD HH:mm:ss');
  }, [createdAt, expiresIn]);

  return <Typography.Text>{expiresDate}</Typography.Text>;
};

const ExpiresSelect = connect(
  InternalExpiresSelect,
  mapProps({
    dataSource: 'options',
  }),
  mapReadPretty(ReadPretty),
);

export { ExpiresSelect };

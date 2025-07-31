import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Result, Button } from 'antd';
import { useTranslation } from 'react-i18next';

const NotFound: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  return (
    <Result
      status="404"
      title="404"
      subTitle={t('errors.notFound')}
      extra={
        <Button type="primary" onClick={() => navigate('/')}>
          {t('common.back')}
        </Button>
      }
    />
  );
};

export default NotFound; 
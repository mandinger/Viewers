import React, { useEffect } from 'react';
import { Header } from '@ohif/ui';
import { useAppConfig } from '@state';
import { useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { Types } from '@ohif/ui';

function UploadFile({ dataSource, servicesManager, onRefresh }: withAppTypes) {
  const { t } = useTranslation();
  const [appConfig] = useAppConfig();
  const PatientInfoVisibility = Types.PatientInfoVisibility;

  const location = useLocation(); // Obtiene el objeto location
  const queryParams = new URLSearchParams(location.search); // Crea un objeto para trabajar con la query string

  const versionNumber = process.env.VERSION_NUMBER;
  const commitHash = process.env.COMMIT_HASH;

  const { customizationService } = servicesManager.services;

  const { component: dicomUploadComponent } =
    customizationService.get('dicomUploadComponent') ?? {};

  // Configuración de las props del componente de subida
  const UploadComponent = dicomUploadComponent
    ? dicomUploadComponent.bind(null, {
      dataSource,
      onComplete: () => {
        onRefresh();
      },
      onStarted: () => { },
    })
    : null;

  useEffect(() => {
    if (!UploadComponent) {
      console.warn('No se encontró el componente de subida de DICOM');
    }
  }, []);

  return (
    <div className="flex h-screen flex-col bg-black">
      <div className="flex flex-grow">
        <UploadComponent />
      </div>
    </div>
  );
}

UploadFile.propTypes = {
  data: PropTypes.array.isRequired,
  dataSource: PropTypes.shape({
    query: PropTypes.object.isRequired,
  }).isRequired,
  isLoadingData: PropTypes.bool.isRequired,
  servicesManager: PropTypes.object.isRequired,
};

export default UploadFile;

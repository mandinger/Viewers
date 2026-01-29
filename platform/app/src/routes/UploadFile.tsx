import React, { useEffect, useState } from 'react';
import { Header } from '@ohif/ui';
import { useAppConfig } from '@state';
import { useLocation, useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { Types } from '@ohif/ui';

function UploadFile({ servicesManager, dataSource }: withAppTypes) {
  const { t } = useTranslation();
  const [appConfig] = useAppConfig();
  const navigate = useNavigate();
  const [uploadKey, setUploadKey] = useState(0);
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
      servicesManager,
      onComplete: () => {
        // Reset the upload component to allow uploading more files
        setUploadKey(prev => prev + 1);
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
      <Header
        isSticky
        menuOptions={[]}
        isReturnEnabled={true}
        onClickReturn={() => navigate('/')}
        WhiteLabeling={appConfig.whiteLabeling}
        showPatientInfo={PatientInfoVisibility.DISABLED}
      />
      <div className="flex flex-grow">
        {UploadComponent && <UploadComponent key={uploadKey} />}
      </div>
    </div>
  );
}

UploadFile.propTypes = {
  servicesManager: PropTypes.object.isRequired,
  dataSource: PropTypes.object.isRequired,
};

export default UploadFile;

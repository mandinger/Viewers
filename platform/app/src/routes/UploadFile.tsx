import React from 'react';
import { Header } from '@ohif/ui';
import { useAppConfig } from '@state';
import { useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { Types, useModal, AboutModal } from '@ohif/ui';

function UploadFile({ dataSource, servicesManager, onRefresh }: withAppTypes) {
  const { show, hide } = useModal();
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

  const uploadProps = dicomUploadComponent
    ? {
      title: 'Upload files',
      closeButton: true,
      shouldCloseOnEsc: false,
      shouldCloseOnOverlayClick: false,
      content: dicomUploadComponent.bind(null, {
        dataSource,
        onComplete: () => {
          hide();
          onRefresh();
        },
        onStarted: () => {
          show({
            ...uploadProps,
            // when upload starts, hide the default close button as closing the dialogue must be handled by the upload dialogue itself
            closeButton: false,
          });
        },
      }),
    }
    : undefined;
  const menuOptions = [
    {
      title: t('Header:About'),
      icon: 'info',
      onClick: () =>
        show({
          content: AboutModal,
          title: t('AboutModal:About OHIF Viewer'),
          contentProps: { versionNumber, commitHash },
          containerDimensions: 'max-w-4xl max-h-4xl',
        }),
    },
  ];

  return (
    <div className="flex h-screen flex-col bg-black">
      <Header
        isSticky
        menuOptions={menuOptions}
        isReturnEnabled={false}
        WhiteLabeling={appConfig.whiteLabeling}
        showPatientInfo={PatientInfoVisibility.DISABLED}
        onUploadClick={uploadProps ? () => show(uploadProps) : undefined}
      />
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

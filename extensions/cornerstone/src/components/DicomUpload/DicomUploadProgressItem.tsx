import React, { ReactElement, memo, useCallback, useEffect, useState } from 'react';
import DicomFileUploader, {
  DicomFileUploaderProgressEvent,
  EVENTS,
  UploadRejection,
  UploadStatus,
} from '../../utils/DicomFileUploader';
import { Icon } from '@ohif/ui';

type DicomUploadProgressItemProps = {
  dicomFileUploader: DicomFileUploader;
};

// eslint-disable-next-line react/display-name
const DicomUploadProgressItem = memo(
  ({ dicomFileUploader }: DicomUploadProgressItemProps): ReactElement => {
    const fileName = dicomFileUploader.getFileName();
    const [percentComplete, setPercentComplete] = useState(dicomFileUploader.getPercentComplete());
    const [failedReason, setFailedReason] = useState('');
    const [status, setStatus] = useState(dicomFileUploader.getStatus());

    const isComplete = useCallback(() => {
      return (
        status === UploadStatus.Failed ||
        status === UploadStatus.Cancelled ||
        status === UploadStatus.Success
      );
    }, [status]);

    useEffect(() => {
      const progressSubscription = dicomFileUploader.subscribe(
        EVENTS.PROGRESS,
        (dicomFileUploaderProgressEvent: DicomFileUploaderProgressEvent) => {
          setPercentComplete(dicomFileUploaderProgressEvent.percentComplete);
        }
      );

      dicomFileUploader
        .load()
        .catch((reason: UploadRejection) => {
          setStatus(reason.status);
          setFailedReason(reason.message ?? '');
        })
        .finally(() => setStatus(dicomFileUploader.getStatus()));

      return () => progressSubscription.unsubscribe();
    }, []);

    const cancelUpload = useCallback(() => {
      dicomFileUploader.cancel();
    }, []);

    const getStatusIcon = (): ReactElement => {
      switch (status) {
        case UploadStatus.Success:
          return (
            <Icon
              name="status-tracked"
              className="text-primary-light"
            ></Icon>
          );
        case UploadStatus.InProgress:
          return <Icon name="icon-transferring"></Icon>;
        case UploadStatus.Failed:
          return <Icon name="icon-alert-small"></Icon>;
        case UploadStatus.Cancelled:
          return <Icon name="icon-alert-outline"></Icon>;
        default:
          return <></>;
      }
    };

    const getStatusText = (): string => {
      switch (status) {
        case UploadStatus.Success:
          return `${fileName} uploaded successfully`;
        case UploadStatus.Failed:
          return failedReason ? `${fileName} failed: ${failedReason}` : `${fileName} upload failed`;
        case UploadStatus.Cancelled:
          return failedReason ? `${fileName} cancelled: ${failedReason}` : `${fileName} upload cancelled`;
        default:
          return '';
      }
    };

    return (
      <div className="min-h-14 border-secondary-light text-primary-light flex w-full items-center overflow-hidden border-b p-2.5 text-lg">
        <div className="self-top min-w-0 flex flex-1 flex-col gap-1">
          <div className="flex gap-4">
            <div className="flex w-6 shrink-0 items-center justify-center">{getStatusIcon()}</div>
            <div className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap font-medium">
              {fileName}
            </div>
          </div>
          {!!getStatusText() && <div className="pl-10 text-sm">{getStatusText()}</div>}
        </div>
        <div className="flex w-24 items-center">
          {!isComplete() && (
            <>
              {status === UploadStatus.InProgress && (
                <div className="w-10 text-right">{percentComplete}%</div>
              )}
              <div className="ml-auto flex cursor-pointer">
                <Icon
                  className="text-primary-active self-center"
                  name="close"
                  onClick={cancelUpload}
                />
              </div>
            </>
          )}
        </div>
      </div>
    );
  }
);

export default DicomUploadProgressItem;

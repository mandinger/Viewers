import React, { ReactNode } from 'react';
import PropTypes from 'prop-types';

import NavBar from '../NavBar';
import Icon from '../Icon';
import IconButton from '../IconButton';
import Dropdown from '../Dropdown';
import HeaderPatientInfo from '../HeaderPatientInfo';
import { PatientInfoVisibility } from '../../types/PatientInfoVisibility';

function Header({
  children,
  menuOptions,
  isReturnEnabled = true,
  onClickReturnButton,
  isSticky = false,
  WhiteLabeling,
  showPatientInfo = PatientInfoVisibility.VISIBLE_COLLAPSED,
  servicesManager,
  Secondary,
  appConfig,
  ...props
}: withAppTypes): ReactNode {
  return (
    <NavBar
      isSticky={isSticky}
      {...props}
    >
      <div className="relative h-[48px] items-center">
        <div className="absolute top-1/2 left-[250px] h-8 -translate-y-1/2">{Secondary}</div>
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transform">
          <div className="flex items-center justify-center space-x-2">{children}</div>
        </div>
        <div className="absolute right-0 top-1/2 flex -translate-y-1/2 select-none items-center">
          {showPatientInfo !== PatientInfoVisibility.DISABLED && (
            <HeaderPatientInfo
              servicesManager={servicesManager}
              appConfig={appConfig}
            />
          )}
          <div className="border-primary-dark mx-1.5 h-[25px] border-r"></div>
          <div className="flex-shrink-0">
            <Dropdown
              id="options"
              showDropdownIcon={false}
              list={menuOptions}
              alignment="right"
            >
              <IconButton
                id={'options-settings-icon'}
                variant="text"
                color="inherit"
                size="initial"
                className="text-primary-active hover:bg-primary-dark h-full w-full"
              >
                <Icon name="icon-settings" />
              </IconButton>
            </Dropdown>
          </div>
        </div>
      </div>
    </NavBar>
  );
}

Header.propTypes = {
  menuOptions: PropTypes.arrayOf(
    PropTypes.shape({
      title: PropTypes.string.isRequired,
      icon: PropTypes.string,
      onClick: PropTypes.func.isRequired,
    })
  ),
  children: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
  isReturnEnabled: PropTypes.bool,
  isSticky: PropTypes.bool,
  onClickReturnButton: PropTypes.func,
  WhiteLabeling: PropTypes.object,
  showPatientInfo: PropTypes.string,
  servicesManager: PropTypes.object,
};

export default Header;

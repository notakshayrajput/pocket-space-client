import React from "react";
import  Icon  from "@ant-design/icons";
import LogoSvg  from "../../assets/icons/logo.svg?react";

const BrandLogo: React.FC<{ style?: React.CSSProperties; className?: string }> = ({
  style,
  className,
}) => {
  const LogoIcon = () => <LogoSvg />;
  return <Icon component={LogoIcon} style={style} className={className} />;
};

export default BrandLogo;

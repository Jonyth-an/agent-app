import { StyleTypeEnum, useCurrentStyleType } from '@/components/Markdown/styles/styleUtils';
import HuaanWelcomeBox from './HuaanWelcomeBox';
import WelcomeBox from './WelcomeBox';

export default function WelcomeBoxWrapper(props: any) {
  const styleType = useCurrentStyleType();
  if (styleType === StyleTypeEnum.huaan) {
    return <HuaanWelcomeBox {...props} />;
  } else {
    return <WelcomeBox {...props} />;
  }
}

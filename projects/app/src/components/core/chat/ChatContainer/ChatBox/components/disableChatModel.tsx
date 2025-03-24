import { Box } from '@chakra-ui/react';
import { useToast } from '@fastgpt/web/hooks/useToast';

const DisableChatModel: React.FC<any> = () => {
  const { toast } = useToast();
  const handleClick = (event: any) => {
    event.stopPropagation();
    event.preventDefault();
    toast({
      title: '问答额度已用完',
      status: 'warning'
    });
  };
  return (
    <Box
      onClick={handleClick}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'transparent', // 确保背景是透明的
        zIndex: 1 // 确保它在其他内容之上
      }}
    >
      {}
    </Box>
  );
};
export default DisableChatModel;

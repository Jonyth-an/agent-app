import { Box, Slide, Image, SimpleGrid, useOutsideClick } from '@chakra-ui/react';
import type React from 'react';
import { useRef } from 'react';

interface ChatToolsProps {
  isOpen: boolean;
  onClose: () => void;
  selectedImages: string[];
  onImageDelete?: (index: number) => void;
}

const ChatTools: React.FC<ChatToolsProps> = ({
  isOpen,
  onClose,
  selectedImages,
  onImageDelete
}) => {
  const ref = useRef<HTMLDivElement>(null);

  useOutsideClick({
    ref: ref,
    handler: onClose
  });

  return (
    <Slide direction="bottom" in={isOpen} style={{ zIndex: 10 }}>
      <Box
        ref={ref}
        position="absolute"
        bottom="100%"
        left={0}
        right={0}
        bg="white"
        boxShadow="lg"
        borderTopRadius="md"
        p={4}
        maxH="50vh"
        overflowY="auto"
      >
        <SimpleGrid columns={3} spacing={2}>
          {selectedImages.map((image, index) => (
            <Box key={index} position="relative" onClick={() => onImageDelete?.(index)}>
              <Image
                src={image || '/placeholder.svg'}
                alt={`Selected image ${index + 1}`}
                objectFit="cover"
                w="100%"
                h="100px"
                borderRadius="md"
              />
            </Box>
          ))}
        </SimpleGrid>
      </Box>
    </Slide>
  );
};

export default ChatTools;

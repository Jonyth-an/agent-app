import { Box, Flex } from '@chakra-ui/react';

const CardSkeleton = () => (
  <Box borderWidth="1px" borderRadius="lg" p={4} bgColor="white">
    <Flex direction="column">
      <Flex alignItems="start" gap={3} borderRadius="md">
        <Box
          flexShrink={0}
          width="65px"
          height="50px"
          borderRadius="md"
          bg="gray.200"
          animation="pulse 1.5s infinite"
        />
        <Box flex={1} minWidth={0} width="170px" height="30px">
          <Box
            height="14px"
            width="80%"
            bg="gray.200"
            borderRadius="md"
            animation="pulse 1.5s infinite"
            mb={2}
          />
          <Box
            height="14px"
            width="60%"
            minWidth="40%"
            bg="gray.200"
            borderRadius="md"
            animation="pulse 1.5s infinite"
          />
        </Box>
      </Flex>
    </Flex>
  </Box>
);

export default CardSkeleton;

import { Box, Text } from "@radix-ui/themes";
import Proposal from "./Proposal";

const Proposals = ({ proposals }) => {
  return (
    <Box className="grid w-full grid-cols-3 gap-2 p-8">
      {proposals && proposals.length === 0 ? (
        <Text>No data to display</Text>
      ) : (
        proposals.map((proposal, i) => (
          <Proposal key={proposal?.proposalId || i} proposal={proposal} />
        ))
      )}
    </Box>
  );
};

export default Proposals;

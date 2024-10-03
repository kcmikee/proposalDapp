import { useCallback, useState, useEffect, useMemo } from "react";
// import { toast } from "react-toastify";
import useContract from "./useContract";
// import { useAppKitAccount } from "@reown/appkit/react";
// import { useAppKitNetwork } from "@reown/appkit/react";
// import { liskSepoliaNetwork } from "../connection";
import { Interface, Contract } from "ethers";
import useRunners from "./useRunners";
import proposalAbi from "../ABI/proposal.json";
import multicallAbi from "../ABI/multicall2.json";
import { multicallAddress } from "../constants/multicallAddress";

const useFetchProposals = () => {
  const readOnlyProposalContract = useContract();
  // const { address } = useAppKitAccount();
  // const { chainId } = useAppKitNetwork();

  const [proposals, setProposals] = useState([]);

  const intfce = useMemo(() => new Interface(proposalAbi), []);
  const { readOnlyProvider } = useRunners();

  const getProposals = useCallback(async () => {
    if (!readOnlyProposalContract) return;

    try {
      const proposalCount = Number(
        await readOnlyProposalContract.proposalCount()
      );

      const proposalsId = Array.from(
        { length: proposalCount },
        (_, i) => i + 1
      );

      proposalsId.pop();

      const calls = proposalsId.map((id) => ({
        target: import.meta.env.VITE_CONTRACT_ADDRESS,
        callData: intfce.encodeFunctionData("proposals", [id]),
      }));

      const multicall = new Contract(
        multicallAddress,
        multicallAbi,
        readOnlyProvider
      );

      // eslint-disable-next-line no-unused-vars
      const [_, proposalsResult] = await multicall.aggregate.staticCall(calls);

      const decodedProposals = proposalsResult.map((result) =>
        intfce.decodeFunctionResult("proposals", result)
      );

      const data = decodedProposals.map((proposalStruct, index) => ({
        proposalId: proposalsId[index],
        description: proposalStruct.description,
        amount: proposalStruct.amount,
        minRequiredVote: proposalStruct.minVotesToPass,
        voteCount: proposalStruct.voteCount,
        deadline: proposalStruct.votingDeadline,
        executed: proposalStruct.executed,
      }));
      setProposals(data);
    } catch (error) {
      console.log("Error fetching proposals", error);
    }
  }, [readOnlyProposalContract, intfce, readOnlyProvider]);

  useEffect(() => {
    getProposals();

    const proposalCreationFilter =
      readOnlyProposalContract.filters.ProposalCreated();
    const votingFilter = readOnlyProposalContract.filters.Voted();

    readOnlyProposalContract.on(proposalCreationFilter, getProposals);
    readOnlyProposalContract.on(votingFilter, getProposals);

    return () => {
      readOnlyProposalContract.removeAllListeners(
        proposalCreationFilter,
        getProposals
      );
      readOnlyProposalContract.removeAllListeners(votingFilter, getProposals);
    };
  }, [intfce, readOnlyProposalContract]);

  return { proposals };
};

export default useFetchProposals;

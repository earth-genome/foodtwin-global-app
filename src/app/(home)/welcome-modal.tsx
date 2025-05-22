"use client";
import { useEffect } from "react";
import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  useDisclosure,
} from "@nextui-org/react";
import { HandPointing } from "@phosphor-icons/react/dist/ssr";

export default function WelcomeModal() {
  const { isOpen, onOpen, onClose } = useDisclosure();

  useEffect(() => {
    const hasVisited = localStorage.getItem("foodtwin:visited");
    if (!hasVisited) {
      onOpen();
      localStorage.setItem("foodtwin:visited", "true");
    }
  }, [onOpen]);

  return (
    <Modal isOpen={isOpen} hideCloseButton>
      <ModalContent className="rounded">
        <ModalBody className="bg-neutral-800 text-neutral-200 font-header p-6">
          <div className="bg-neutral-700 text-center rounded p-2 mb-4">
            <h1 className="font-header uppercase tracking-tighter mb-2">
              Welcome to the Food Twin Map
            </h1>
            <p className="text-neutral-400 text-sm italic font-body">
              By{" "}
              <a
                href="https://theplotline.org"
                className="not-italic ml-1 underline"
              >
                The Plotline
              </a>
            </p>
          </div>
          <div className="flex gap-4 items-center mb-4">
            <div>
              <HandPointing size={32} />
            </div>
            <p className="text-sm tracking-tight">
              Discover where food is produced and how it travels around the
              world by selecting any region.
            </p>
          </div>
          <Button
            className="rounded text-sm text-white bg-accent-warm-400"
            onClick={() => onClose()}
          >
            Explore Food Flows
          </Button>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

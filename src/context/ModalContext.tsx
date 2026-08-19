// React Modal Context
import { useState, createContext, useContext, ReactNode, FC, useEffect, useRef, useCallback } from 'react';
import { ImCross } from 'react-icons/im';

export interface ModalProps {
  hideModal: () => void;
  setOnHidden?: (onHidden: () => void) => void;
  setTitle?: (title: string) => void;
}

interface ShowModalOption {
  children: FC<ModalProps>;
  onHidden?: () => void;
  hideOnOverlayClick?: boolean;
  title?: string;
  hideCloseButton?: boolean;
}

export type ModalContextType = {
  showModal: (props: ShowModalOption) => void;
  hideModal: () => void;
};

const ModalContext = createContext<ModalContextType>({
  showModal: () => console.log('openModal not yet initialized'),
  hideModal: () => console.log('closeModal not yet initialized'),
});

export const useModal = () => useContext(ModalContext);

export const ModalProvider = ({ children }: { children: ReactNode }) => {
  const [modalProps, setModalProps] = useState<ShowModalOption | undefined>(undefined);
  const [onHidden, setOnHidden] = useState<(() => void) | undefined>(undefined);
  const [title, setTitle] = useState<string | undefined>(undefined);
  const switchAnimate = useRef(false);
  const modalBoxRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const existingPopStateListener = useRef<typeof window.onpopstate>(window.onpopstate);

  const keydownListener = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      hideModal();
    }
  }, []);

  const hideModal = () => {
    setModalProps(undefined);
    onHidden?.();
    setOnHidden(undefined);
    setTitle(undefined);
    window.onpopstate = existingPopStateListener.current;
    existingPopStateListener.current = null;
    window.removeEventListener('keydown', keydownListener);
    previouslyFocusedRef.current?.focus();
  };

  const showModal = (props: ShowModalOption) => {
    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
    window.addEventListener('keydown', keydownListener);
    existingPopStateListener.current = window.onpopstate;
    window.onpopstate = () => hideModal();
    setModalProps(props);
  };

  useEffect(() => {
    if (!modalProps) return;
    requestAnimationFrame(() => modalBoxRef.current?.focus());
  }, [modalProps]);

  useEffect(() => {
    if (modalProps?.onHidden) {
      setOnHidden(() => modalProps.onHidden);
    }

    if (modalProps?.title) {
      setTitle(modalProps.title);
    }
  }, [modalProps]);

  const setOnHiddenWrapper = (onHidden: () => void) => {
    setOnHidden(() => onHidden);
  };

  return (
    <ModalContext.Provider value={{ showModal, hideModal }}>
      {children}
      <div
        className='modal data-[open=true]:modal-open'
        onClick={() => modalProps?.hideOnOverlayClick && hideModal()}
        data-open={!!modalProps}
        role='dialog'
        aria-modal='true'
        aria-label={title}
      >
        <div
          ref={modalBoxRef}
          tabIndex={-1}
          className='glass modal-box m-2 max-h-[calc(100dvh-1rem)] w-[calc(100vw-1rem)] max-w-5xl cursor-default overflow-hidden transition-[width,height] sm:m-4'
          onClick={e => e.stopPropagation()}
        >
          {(switchAnimate.current = !switchAnimate.current)}
          {title && <h1 className='text-center text-lg font-semibold'>{title}</h1>}
          {modalProps && (
            <>
              {!modalProps.hideCloseButton && (
                <button
                  type='button'
                  title='Close'
                  aria-label='Close'
                  className='icon-button absolute right-2 top-2 z-10'
                  onClick={() => hideModal()}
                >
                  <ImCross />
                </button>
              )}
              <div className='no-scrollbar max-h-[calc(100dvh-5rem)] overflow-y-auto overscroll-contain px-1 pb-2 pt-1'>
                <modalProps.children hideModal={hideModal} setOnHidden={setOnHiddenWrapper} setTitle={setTitle} />
              </div>
            </>
          )}
        </div>
      </div>
    </ModalContext.Provider>
  );
};

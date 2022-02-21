import React from "react"

type ErrorHandler = (error: Error, info: React.ErrorInfo) => void
type ErrorHandlingComponent<Props> = (props: Props, error?: Error) => React.ReactNode

type ErrorState = { error?: Error }

function Catch<Props extends {}>(
    component: ErrorHandlingComponent<Props>,
    errorHandler?: ErrorHandler
): React.ComponentType<Props> {
    return class extends React.Component<Props, ErrorState> {
        state: ErrorState = {
            error: undefined
        }

        static getDerivedStateFromError(error: Error) {
            return { error }
        }

        componentDidCatch(error: Error, info: React.ErrorInfo) {
            if (errorHandler) {
                errorHandler(error, info)
            }
        }

        render() {
            return component(this.props, this.state.error)
        }
    }
}

const ErrorBoundary = Catch(function ErrorBoundary(props: React.PropsWithChildren<{}>, error) {
    if(error) {
        console.log(error);
        return (
            <pre>
                {error.stack}
            </pre>
        );
    } else {
        return <>{props.children}</>;
    }
});

export default ErrorBoundary;
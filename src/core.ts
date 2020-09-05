export type ValidatorFunction<ExpectedType> = (value: any) => ExpectedType;

type ValidatorFunctionConstructor<Params, ExpectedType> = (params: Params) => ValidatorFunction<ExpectedType>

export type ValidatorSpec<ExpectedType> = {
    readonly [P in keyof ExpectedType]: ValidatorFunction<ExpectedType[P]>;
};

export type TypeHint<Spec extends ValidatorSpec<any>> = {
    readonly [P in keyof Spec]: ReturnType<Spec[P]>;
}

class GetParams {}

const GET_PARAMS = new GetParams();

const mapSpec = <ExpectedType, R> (
    validatorSpec: ValidatorSpec<ExpectedType>, 
    transform: (
        validator: ValidatorFunction<ExpectedType>, 
        key: string
    ) => R
): any => Object.fromEntries(
    Object.entries(validatorSpec).map(
        ([key, validator]: [string, any]) => [key, transform(validator, key)]
    )
);

export const getParams = <T> (validatorSpec: ValidatorSpec<T>): any => 
    mapSpec(validatorSpec, validator => validator(GET_PARAMS));
    
export const validate = <T> (validatorSpec: ValidatorSpec<T>, value: any): T =>
    mapSpec(validatorSpec, (validator, key) => validator(value[key]));

export type ValidatorFunctionWithSpec<Params, ExpectedType> = (params: Params, value: any) => ExpectedType

const validateOrGetParams = <ExpectedType, Params> (
    validatorFunctionWithSpec: ValidatorFunctionWithSpec<Params, ExpectedType>, 
    params: Params, 
    value: any
): ExpectedType => value === GET_PARAMS ? params as any : validatorFunctionWithSpec(params, value)

export const declareField = <ExpectedType, Params> (
    validatorFunctionWithSpec: ValidatorFunctionWithSpec<Params, ExpectedType>
): ValidatorFunctionConstructor<Params, ExpectedType> => 
    (params: Params) => 
    (value: any) => 
    validateOrGetParams(validatorFunctionWithSpec, params, value);
import { IRequest } from "itty-router";
import { v4 as uuidv4 } from "uuid";

import { getCustomersDetails, getOneCustomerDetails } from "../helper";
import { Env } from "../types";
import { corsHeaders } from "../utils/constant";

export const getCustomersCallback = async (request: IRequest, env: Env) => {
    const customerDetails = await getCustomersDetails(env)
    if (customerDetails) {
        return Response.json(customerDetails, {
            headers: { ...corsHeaders }
        });
    } else {
        return Response.json({
            error: true,
            message: "Could not find customer list"
        }, {
            status: 500,
            headers: { ...corsHeaders }
        })
    }
}

export const getSingleCustomerCallback = async (request: IRequest, env: Env) => {
    const { customerId } = request.params;

    const customerDetails = await getOneCustomerDetails(env, { name: customerId });

    if("error" in customerDetails) {
        return Response.json({
            error: customerDetails.error,
            message: customerDetails.message,
            erorCode: customerDetails.errorCode
        }, {
            status: 500,
            headers: { ...corsHeaders }
        })
    }

    if (customerDetails) {
        return Response.json(customerDetails, {
            headers: { ...corsHeaders }
        });
    }
}

export const createCustomer = async (request: IRequest, env: Env) => {
    const customerId = uuidv4();

    const body: { customerName: string, host: string, endpoints: any[] } = await request.json();

    if(!body.customerName || !body.host || !body.endpoints.length) {
        return Response.json({
            error: true,
            body,
            message: 'Bad Request',
            errorCode: 1003
        }, {
            status: 400,
            headers: { ...corsHeaders }
        })
    }

    const endpoints = body.endpoints.map(endpoint => {
        return {
            endpointId: uuidv4(),
            ...endpoint
        }
    })

    const customerData = {
        customerId,
        ...body,
        endpoints,
    }

    await env.Customers.put(customerId, JSON.stringify(customerData));

    return Response.json({
        message: "Customer added successfully",
        customerData
    }, {
        headers: { ...corsHeaders }
    })
}

export const createEndpoint = async (request: IRequest, env: Env) => {
    const { customerId } = request.params;
    const body = await request.json();
    const endpointId = uuidv4();

    const existingCustomer = await getOneCustomerDetails(env, { name: customerId });

    if("error" in existingCustomer) {
        return Response.json({
            error: existingCustomer.error,
            message: existingCustomer.message,
            errorCode: existingCustomer.errorCode
        })
    }

    let tempEndpoint = existingCustomer.endpoints;

    tempEndpoint = [...tempEndpoint, { endpointId, ...body}]
    existingCustomer.endpoints = tempEndpoint;

    await env.Customers.put(customerId, JSON.stringify(existingCustomer));

    return Response.json({
        message: 'Endpoint added',
        customerData: existingCustomer
    }, {
        headers: { ...corsHeaders }
    })
}
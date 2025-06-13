import { NotFoundException } from "../common/utils/catch-errors"
import { config } from "../config/app.config";

export async function getQiz(subject: string) {
    const response = await fetch(`https://questions.aloc.com.ng/api/v2/q/20?subject=${subject}`, {
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            AccessToken: config.ALOC_ACCESS_TOKEN,
        },
        method: "GET"
    })
    if (!response.ok) throw new NotFoundException("Questions not found");
    const data = await response.json();
    return data;
}
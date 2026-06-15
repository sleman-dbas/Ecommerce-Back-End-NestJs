import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { AuthService } from "../auth.service";
import { Request } from "express";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy){
    constructor(
        private AuthService:AuthService
    ){
        super({
            jwtFromRequest: ExtractJwt.fromExtractors([(request: Request) => {
                return request?.cookies?.access_token;
            }]),
            ignoreExpiration: false,
            secretOrKey: process.env.JWT_SECRET
        })
    }

    async validate(payload: any){
        try {
            const user = await this.AuthService.getUserById(payload.sub)
            return {
                id: user.id,
                role: user.role,
                name : user.name,
                email: user.email
            };
        } catch (error) {
            throw new UnauthorizedException('invalid token')
        }       
    }
}
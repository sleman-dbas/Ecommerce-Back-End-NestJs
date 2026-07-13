import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { AuthService } from "../services/auth.service";
import { Request } from "express";
import type { ConfigType } from "@nestjs/config";
import { Inject } from "@nestjs/common";
import authConfig from "../../config/auth.config";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy){
    constructor(
        private AuthService:AuthService,
        @Inject(authConfig.KEY)
        private readonly authConfiguration: ConfigType<typeof authConfig>,
    ){
        super({
            jwtFromRequest: ExtractJwt.fromExtractors([(request: Request) => {
                return request?.cookies?.access_token;
            }]),
            ignoreExpiration: false,
            secretOrKey: authConfiguration.jwtSecret
        })
    }

    async validate(payload: any){
        try {
            const user = await this.AuthService.getUserById(payload.sub)
            if (Number(payload.tokenVersion ?? 0) !== Number(user.tokenVersion ?? 0)) {
                throw new UnauthorizedException('invalid token')
            }
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